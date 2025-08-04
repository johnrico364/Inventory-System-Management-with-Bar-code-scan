import 'dart:convert';
import 'package:http/http.dart' as http;

class ProductService {
  // Multiple URL options for different scenarios
  static const String _localhostUrl = 'http://localhost:4000/api';
  static const String _ipUrl = 'http://192.168.0.109:4000/api'; // Your actual IP
  static const String _emulatorUrl = 'http://10.0.2.2:4000/api'; // Android emulator
  
  // Choose the appropriate URL based on your setup
  static const String baseUrl = _ipUrl; // Change this based on your needs
  
  // Network connectivity check
  static Future<bool> checkConnectivity() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/products/get'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      
      return response.statusCode == 200;
    } catch (e) {
      print('Network connectivity check failed: $e');
      return false;
    }
  }
  
  // Fetch all products
  static Future<List<Map<String, dynamic>>> fetchProducts() async {
    try {
      print('Attempting to connect to: $baseUrl/products/get');
      
      final response = await http.get(
        Uri.parse('$baseUrl/products/get'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data);
      } else {
        throw Exception('Failed to fetch products: ${response.statusCode}');
      }
    } catch (e) {
      print('Error in fetchProducts: $e');
      throw Exception('Error fetching products: $e');
    }
  }

  // Fetch a single product by barcode
  static Future<Map<String, dynamic>?> fetchProductByBarcode(String barcode) async {
    try {
      print('Fetching product with barcode: $barcode');
      print('API URL: $baseUrl/products/get');
      
      final response = await http.get(
        Uri.parse('$baseUrl/products/get'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      print('Response status code: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final product = data.firstWhere(
          (product) => product['barcode'].toString() == barcode,
          orElse: () => null,
        );
        
        if (product != null) {
          print('Product found: ${product['name']}');
        } else {
          print('Product not found for barcode: $barcode');
        }
        
        return product;
      } else {
        throw Exception('Failed to fetch product: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('Error fetching product: $e');
      throw Exception('Error fetching product: $e');
    }
  }

  // Update product quantity (in/out items)
  static Future<bool> updateProductQuantity(String barcode, int quantity, bool isInItem) async {
    try {
      print('Updating product quantity - Barcode: $barcode, Quantity: $quantity, Mode: ${isInItem ? "IN" : "OUT"}');
      
      // First, get the current product to check if it exists
      final currentProduct = await fetchProductByBarcode(barcode);
      
      if (currentProduct == null) {
        throw Exception('Product with barcode $barcode not found');
      }

      // Calculate new quantity
      int currentQuantity = currentProduct['stocks'] ?? 0; // Use 'stocks' field
      int newQuantity;
      
      if (isInItem) {
        // Adding items to inventory
        newQuantity = currentQuantity + quantity;
        print('Adding $quantity items. Current: $currentQuantity, New: $newQuantity');
      } else {
        // Removing items from inventory
        newQuantity = currentQuantity - quantity;
        if (newQuantity < 0) {
          throw Exception('Insufficient stock. Available: $currentQuantity, Requested: $quantity');
        }
        print('Removing $quantity items. Current: $currentQuantity, New: $newQuantity');
      }

      // Update the product quantity
      final updateData = {
        'stocks': newQuantity, // Send 'stocks' field to match schema
        'lastUpdated': DateTime.now().toIso8601String(),
      };
      
      print('Sending update data: $updateData');
      
      final response = await http.put(
        Uri.parse('$baseUrl/products/update/$barcode'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(updateData),
      );

      print('Update response status: ${response.statusCode}');
      print('Update response body: ${response.body}');

      if (response.statusCode == 200) {
        print('Product updated successfully');
        return true;
      } else {
        throw Exception('Failed to update product: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('Error updating product: $e');
      throw Exception('Error updating product: $e');
    }
  }

  // Add new product to inventory
  static Future<bool> addNewProduct(Map<String, dynamic> productData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/products/add'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(productData),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return true;
      } else {
        throw Exception('Failed to add product: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error adding product: $e');
    }
  }

  // Get product history or logs
  static Future<List<Map<String, dynamic>>> getProductHistory(String barcode) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/products/history/$barcode'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data);
      } else {
        throw Exception('Failed to fetch product history: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching product history: $e');
    }
  }

  // Log inventory transaction
  static Future<bool> logTransaction(String barcode, int quantity, bool isInItem, String? notes) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/products/transaction'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'barcode': barcode,
          'quantity': quantity,
          'type': isInItem ? 'IN' : 'OUT',
          'timestamp': DateTime.now().toIso8601String(),
          'notes': notes ?? '',
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return true;
      } else {
        throw Exception('Failed to log transaction: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error logging transaction: $e');
    }
  }
}

// Product model class
class Product {
  final String id;
  final String name;
  final String barcode;
  final int quantity;
  final String? description;
  final String? category;
  final DateTime? lastUpdated;

  Product({
    required this.id,
    required this.name,
    required this.barcode,
    required this.quantity,
    this.description,
    this.category,
    this.lastUpdated,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      barcode: json['barcode'] ?? '',
      quantity: json['quantity'] ?? 0,
      description: json['description'],
      category: json['category'],
      lastUpdated: json['lastUpdated'] != null 
          ? DateTime.parse(json['lastUpdated'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'barcode': barcode,
      'quantity': quantity,
      'description': description,
      'category': category,
      'lastUpdated': lastUpdated?.toIso8601String(),
    };
  }
}
